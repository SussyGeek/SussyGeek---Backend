type locationType = {
    city: string,
    state: string,
    country: string
};

type addInstituteSvcType = {
    name: string,
    slug: string,
    registeredGeeks: number,
    location: locationType
}

type instituteInputBodyType = {
    name: string,
    slug: string,
    studentCount: number,
    city: string,
    country: string,
    state: string 
}

// TODO: Change once you fix at the validation layer.
type instituteFetchQueryTypes = {
    id: string,
    page: string,
    name: string,
    limit: string
};