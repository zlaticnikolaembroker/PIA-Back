import { Nullable } from '../types/Nullable';
export interface user {
    id: number,
    name: Nullable<string>,
    username: string,
    password: string,
    email: string,
    role_id: number,
    date: Date,
    place: string,
    lastname: Nullable<string>,
    phone: Nullable<string>,
    fullName: Nullable<string>,
};