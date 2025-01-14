import { AuthenticationClient, ManagementClient } from 'auth0';

let auth0: ManagementClient;

export function initAuth0() {
    auth0 = new ManagementClient({
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.MANAGEMENT_AUTH0_CLIENT_ID,
        clientSecret: process.env.MANAGEMENT_AUTH0_CLIENT_SECRET
    });
    if (auth0 == null) {
        return false;
    }
    return true;
}

export async function deleteUserFromAuth0(sub: string) {
    // let formatted_sub = sub.split('|')[1];
    let res = await auth0.users.delete({ id: sub });
    if(res == undefined) {
        return true;
    }
    return false;
}

export async function assignAuth0Role(sub: string, role: string) {
    // let formatted_sub = sub.split('|')[1];
    let res = await auth0.users.assignRoles({ id: sub }, { roles: [role] });
    return true;
}