export type LocationType = {
    city: string,
    state: string,
    country: string
};

export type AddInstituteSvcType = {
    name: string,
    slug: string,
    registeredGeeks: number,
    location: LocationType
}

// TODO: Change once you fix at the validation layer.
export type InstituteFetchQueryTypes = {
    id: string,
    page: string,
    name: string,
    limit: string
};