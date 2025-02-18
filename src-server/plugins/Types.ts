

export interface ICard extends Iterable<string> {
    alignment: string,
    code: string,
    normalizedtitle: string,
    ImageName:string,
    ImageNameES?:string,
    ImageNameErrataDC?:string,
    title:string,
    set_code:string,
    Secondary:string,
    keywords?:string[],
    RPath?:string,
    region_type?:string,
    site_type?:string,
    Site?:string,
    dreamcard?:boolean;
    uniqueness?:boolean,
    isUnderdeep?:boolean
    [key:string]:any
}

export interface ICardMapCard {
    [key:string]:ICard
}

export interface ISiteTitleCards extends Iterable<ICard[]>
{
    [key:string]:ICard[]
}

export type KeyValuesString = {
    [key:string] : string
}

export type CardImages = {
    image: string,
    imageES?:string,
    ImageNameErrataDC?:string
}

export interface DeckValidateSection {
    [key:string]: number
}

export interface DeckValidate {
    pool : DeckValidateSection,
    playdeck : DeckValidateSection,
    sideboard : DeckValidateSection,
    sites: DeckValidateSection,
    [key:string]: DeckValidateSection
}

export interface DeckValidateArda extends DeckValidate {
    stage : DeckValidateSection,
    minors : DeckValidateSection,
    mps : DeckValidateSection,
    chars_special : DeckValidateSection,
    chars_mind7 : DeckValidateSection,
    chars_others : DeckValidateSection,
}


export interface PlaydeckStandard extends DeckValidate {
    
}

export interface PlaydeckArda extends DeckValidateArda {
    
}
