export interface Person {
  id?: number
  name: string
  coordinates: Coordinates
  eyeColor: Color
  hairColor: Color
  location: Location
  height: number
  weight: number
  passportID: string
  nationality: Country
}

export interface Coordinates {
  x: number
  y: number
}

export interface Location {
  name: string
  x: number
  y: number
  z: number
}

export enum Color {
  RED = 'RED',
  YELLOW = 'YELLOW',
  ORANGE = 'ORANGE',
  WHITE = 'WHITE',
  BROWN = 'BROWN'
}

export enum Country {
  RUSSIA = 'RUSSIA',
  NORTH_KOREA = 'NORTH_KOREA',
  JAPAN = 'JAPAN'
}
