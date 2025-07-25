@load ./deployment_hosts
@load ./trusted_macs
@load base/protocols/http
@load base/protocols/modbus
@load icsnpp/s7comm

redef mmdb_dir = "GeoLite2DB";
redef Reporter::warnings_to_stderr = F;

module Scan;

export {
    redef enum Log::ID += { LOG };

    type Info: record {
        ts: time        &log;
        id: conn_id     &log;
        uid: string     &log;
        service: string &log &optional;
        history: string &log &optional;
    };
}

redef record connection += {
    scan: Info &optional;
};

export {
    const http_post_body_length = 200 &redef;
    const http_get_body_length = 200 &redef;

    type GeoInfo: record {
        country_code: string &optional &log;
        region: string &optional &log;
        city: string &optional &log;
        point: vector of double &optional &log;
    };

    type GeoPair: record {
        orig: GeoInfo &optional &log;
        resp: GeoInfo &optional &log;
    };    
}

redef record Conn::Info += {
    geo: GeoPair &optional &log;
};

redef record HTTP::Info += {
    post_body: string &log &optional;
};

event log_post_bodies(f: fa_file, data: string)
{
    for ( cid in f$conns ) {
        local c: connection = f$conns[cid];
        if ( ! c$http?$post_body )
            c$http$post_body = "";

        if ( |c$http$post_body| > http_post_body_length )
            return;

        c$http$post_body = c$http$post_body + data;
        if ( |c$http$post_body| > http_post_body_length ) {
            c$http$post_body = c$http$post_body[0:http_post_body_length] + "...";
        }
    }
}

event file_over_new_connection(f: fa_file, c: connection, is_orig: bool)
{
    if ( is_orig && c?$http && c$http?$method && c$http$method == "POST" ) {
        Files::add_analyzer(f, Files::ANALYZER_DATA_EVENT, [$stream_event=log_post_bodies]);
    }
}

event connection_state_remove(c: connection) 
{
    if (c$history == "ShAR" || c$history=="ShADadfR" || c$history=="ShR") {
        local rec: Scan::Info = [$ts=network_time(), $id=c$id, $history=c$history, $uid = c$uid];
        c$scan = rec;
        Log::write(Scan::LOG, rec);
    }

    local orig_geo: GeoInfo;
    local orig_loc = lookup_location(c$id$orig_h);    
    if ( orig_loc?$country_code )
        orig_geo$country_code = orig_loc$country_code;
    if ( orig_loc?$region )
        orig_geo$region = orig_loc$region;
    if ( orig_loc?$city )
        orig_geo$city = orig_loc$city;
    if ( orig_loc?$longitude && orig_loc?$latitude )
        orig_geo$point = [orig_loc$latitude, orig_loc$longitude];

    local resp_geo: GeoInfo;
    local resp_loc = lookup_location(c$id$resp_h);
    if ( resp_loc?$country_code )
        resp_geo$country_code = resp_loc$country_code;
    if ( resp_loc?$region )
        resp_geo$region = resp_loc$region;
    if ( resp_loc?$city )
        resp_geo$city = resp_loc$city;
    if ( orig_loc?$longitude && orig_loc?$latitude )
        orig_geo$point = [orig_loc$latitude, orig_loc$longitude];

    local geo_pair: GeoPair;
    geo_pair$orig = orig_geo;
    geo_pair$resp = resp_geo;

    c$conn$geo = geo_pair;
}


##! Module to detect simple DoS patterns (example flooding with write_single_coil)
module ModbusDos;

export {
    redef enum Log::ID += { LOG };

    type Info: record {
        ts: time &log;
        id: conn_id &log;
        uid: string &log;
        msg: string &log;
    };
}

global mbus_count: table[addr] of count &default=0;

event zeek_init()
    {
    Log::create_stream(LOG, [$columns=ModbusDos::Info]);
    }

#Funzione generica per controllo flooding
function check_dos(c: connection, reason: string)
    {
    if ( c$id$orig_h in trusted_ips ) return;
    if ( mbus_count[c$id$orig_h] > 100 && c$duration < 10sec )
        {
        local rec: ModbusDos::Info = [$ts=network_time(),
                                      $id=c$id,
                                      $uid=c$uid,
                                      $msg=fmt("Possible Modbus DoS (%s) from %s", reason, c$id$orig_h)];
        Log::write(LOG, rec);
        }
    }

## Analisi per write_single_coil
event modbus_write_single_coil_request(c: connection, headers: ModbusHeaders, address: count, value: bool)
    {
    mbus_count[c$id$orig_h] += 1;
    check_dos(c, "write_single_coil");
    }

## Analisi per read_coils
event modbus_read_coils_request(c: connection, headers: ModbusHeaders, start_addr: count, quantity: count)
    {
    mbus_count[c$id$orig_h] += 1;
    check_dos(c, "read_coils");
    }

## Analisi per write_multiple_registers
event modbus_write_multiple_registers_request(c: connection, headers: ModbusHeaders, start_address: count, registers: ModbusRegisters)
    {
    mbus_count[c$id$orig_h] += 1;
    check_dos(c, "write_multiple_registers");
    }

##! Module to detect ARP spoofing
module ArpSpoof;

export {
    redef enum Log::ID += { LOG };

    type Info: record {
        ts: time &log;
        ip: addr &log;
        mac: string &log;
        msg: string &log;
    };

}

event arp_request(mac_src: string, mac_dst: string, SPA: addr, SHA: string, TPA: addr, THA: string) {
    if ( SPA in trusted_devices && SHA != trusted_devices[SPA] ) {
        local rec: Info = [$ts=network_time(),
                           $ip=SPA,
                           $mac=SHA,
                           $msg=fmt("ARP request spoofing: %s claims to be %s", SHA, SPA)];
        Log::write(LOG, rec);
    }
}

event arp_reply(mac_src: string, mac_dst: string, SPA: addr, SHA: string, TPA: addr, THA: string) {
    if ( SPA in trusted_devices && SHA != trusted_devices[SPA] ) {
        local rec: Info = [$ts=network_time(),
                           $ip=SPA,
                           $mac=SHA,
                           $msg=fmt("ARP reply sent: %s is-at %s - Possible ARP Spoofing", SPA, SHA)];
        Log::write(LOG, rec);
    }
}


event zeek_init() &priority=5 {
    print("Starting Analisys");
    Log::create_stream(Scan::LOG, [$columns=Scan::Info]);
    Log::create_stream(ModbusDos::LOG, [$columns=ModbusDos::Info]);
    Log::create_stream(ArpSpoof::LOG, [$columns=ArpSpoof::Info]);
}

event zeek_done() {
    print("Analisys Complete");
}