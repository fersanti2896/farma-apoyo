
export interface CPRequest {
    postalCode: string;
}

export interface MunicipalityRequest {
    c_estado: string;
}

export interface TownRequest {
    c_estado: string;
    c_mnpio: string
}

export interface States {
    c_estado: string;
    d_estado: string;
}

export interface Neighborhoods {
    id_asenta_cpcons: string;
    d_asenta: string;
}

export interface CP {
    id_postalCodes: number;
    d_codigo: string;
    c_estado: string;
    d_estado: string;
    c_mnpio: string;
    d_mnpio: string;
    neighborhoods: Neighborhoods[];
}

export interface Municipality {
    c_mnpio: string;
    d_mnpio: string;
}

export interface Town {
    d_codigo: string;
    id_asenta_cpcons: string;
    d_asenta: string;
}

export interface StatesResponse {
    result: States[];
    error: {
        code: number;
        message: string;
    } | null;
}

export interface CPResponse {
    result: CP;
    error: {
        code: number;
        message: string;
    } | null;
}

export interface MunicipalityReponse {
    result: Municipality[];
    error: {
        code: number;
        message: string;
    } | null;
}

export interface TownReponse {
    result: Town[];
    error: {
        code: number;
        message: string;
    } | null;
}