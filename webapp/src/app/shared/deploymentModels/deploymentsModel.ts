export interface Container {
    IP: string;
    name: string;
    status?: string;
}

export interface DeployModel {
    name: string;
    IP: string;
    user: string;
    passw: string;
    active: boolean;
    Containers : Container[];
    status?: string; // AGGIUNGI questa riga
}

export interface DeploymentsModel {
    delay: number;
    MaxMind_GeoDB_Key: string;
    RemoteDeployments: DeployModel[];
}
