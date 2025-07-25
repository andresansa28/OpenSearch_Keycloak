import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})


export class UsermanagmentApiService {
  private url = 'http://172.17.0.1:5000'

  constructor(private httpClient: HttpClient) { }

  getUsers() {
    return this.httpClient.get(this.url + "/users");
  }


  removeUser(id: string) {
    let queryParams = new HttpParams();
    queryParams = queryParams.append("user_id", id)
    return this.httpClient.delete(this.url + "/user/delete/", { params: queryParams });
  }

  createUser(username: string, firstname: string, lastname: string, email: any, password: any) {
    const headers = { 'Content-Type': 'application/json' }
    return this.httpClient.post(this.url + "/user/create/",
      {
        username: username,
        first_name: firstname,
        last_name: lastname,
        email: email,
        password: password
      }, { headers: headers });
  }

  getUserRoles(id: string) {
    let queryParams = new HttpParams();
    queryParams = queryParams.append("user_id", id)
    return this.httpClient.get(this.url + "/user/group/", { params: queryParams });
  }

  getAllGroups() {
    return this.httpClient.get(this.url + "/groups");
  }

  setUserGroup(id: string, gid: string) {
    const headers = { 'Content-Type': 'application/json' }
    console.log(id)
    console.log(gid)
    return this.httpClient.post(this.url + "/user/group/add/",
      {
        user_id: id,
        group_name: gid
      }, { headers: headers });
  }

  createGroup(groupName: string, description?: string) {
    const headers = { 'Content-Type': 'application/json' }
    return this.httpClient.post(this.url + "/group/create/",
      {
        name: groupName,
        description: description || `Gruppo per deployment ${groupName}`
      }, { headers: headers });
  }

  deleteGroup(groupName: string) {
    let queryParams = new HttpParams();
    queryParams = queryParams.append("group_name", groupName);
    return this.httpClient.delete(this.url + "/group/delete/", { params: queryParams });
  }

  removeUserFromGroup(userId: string, groupName: string) {
    const headers = { 'Content-Type': 'application/json' }
    return this.httpClient.post(this.url + "/user/group/remove/",
      {
        user_id: userId,
        group_name: groupName
      }, { headers: headers });
  }

  updateUser(userData: any) {
    return this.httpClient.put(`${this.url}/user/update/`, userData);
  }

  
}
