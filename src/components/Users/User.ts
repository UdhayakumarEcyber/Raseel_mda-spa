import { IContextProvider } from "../../uxp";

export interface IUser {
    LoginID: string;
    FirstName: string;
    LastName: string;
    FullName: string;
    ProfileImageName: string;
    UserType: string;
    Phone: string;
    Email: string;
    OfficePhone: string;
    SiteKey: string;
    TimeFormat: string;
    DateFormat: string;
    CurrencyFormat: string;
    Language: string;
    UserGroupKey: string;
    IsLoginDisabled: string;
    IdentificationNumber: string;
    InheritanceUserKey: string;
    LegalName: string;
    LastLoginDate: string;
    IsHiddenByConversion: string;
    Hidden: string;
    IsBlacklist: string;
    IsAnonymous: string;
    UserKey: string;
    ObjectID: string;
    ObjectKey: string;
    DisplayName: string;
    ObjectID1: string;
    UserGroupID: string;
    InheritUserName: string;
    InheritanceUserDisplayName: string;
    SiteLocationFullName: string;
}

export async function fetchAllUsers(uxpContext: IContextProvider): Promise<IUser[]> {
    return await uxpContext.executeAction("User", "getUsers", {}, { json: true });
}

export async function findUserByUserKey(UserKey: string, uxpContext: IContextProvider): Promise<IUser> {
    if(!UserKey) return null;

    const res =  await uxpContext.executeAction("User", "getUser", {UserKey}, { json: true });
    return res[0];
}

export async function getCurrentUserDetails(uxpContext: IContextProvider) {
    const data = await uxpContext.getUserDetails() as any;
    try {
        let userGroup = data?.userGroupName?.toLowerCase() || null
        let userKey = uxpContext.userKey

        return { userGroupName: userGroup, userKey }
    } catch (error) {
        console.error(error);
    }
}