-- Erstelle Enums für die Wish-Factory Datenbank
-- Basierend auf FRS-Spezifikation

-- Enum für Wish-Typen
CREATE TYPE wish_type AS ENUM (
    'normal',
    'funny'
);

-- Enum für Event-Typen
CREATE TYPE event_type AS ENUM (
    'birthday',
    'anniversary', 
    'custom'
);

-- Enum für Wish-Status
CREATE TYPE wish_status AS ENUM (
    'Entwurf',
    'Zur Freigabe',
    'Freigegeben',
    'Archiviert'
);

-- Enum für Sprachen
CREATE TYPE language AS ENUM (
    'de',
    'en'
);

-- Enum für Benutzerrollen
CREATE TYPE user_role AS ENUM (
    'Redakteur',
    'Administrator'
);

-- Enum für Relationen
CREATE TYPE relation AS ENUM (
    'friend',
    'family',
    'partner',
    'colleague'
);

-- Enum für Altersgruppen
CREATE TYPE age_group AS ENUM (
    'all',
    'young',
    'middle',
    'senior'
);