-- VeriFactu: first internal issuance slice.
-- Apply this script in the Supabase SQL editor before using /api/verifactu.
-- AEAT submission, certificate signing and official QR payload are deliberately
-- kept as a later compliance phase and are represented by aeat_estado.

create extension if not exists pgcrypto;

create table if not exists public.verifactu_facturas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete restrict,
  creado_por uuid not null references auth.users(id) on delete restrict,
  numero integer not null check (numero > 0),
  fecha_emision timestamptz not null,
  cliente jsonb,
  base_imponible numeric(12, 2) not null check (base_imponible >= 0),
  iva numeric(12, 2) not null check (iva >= 0),
  total numeric(12, 2) not null check (total >= 0),
  estado text not null default 'emitida_local' check (estado in ('emitida_local', 'anulada')),
  huella text not null check (length(huella) = 64),
  huella_anterior text,
  aeat_estado text not null default 'pendiente_configuracion' check (aeat_estado in ('pendiente_configuracion', 'pendiente_envio', 'aceptada', 'rechazada', 'incidencia')),
  created_at timestamptz not null default now(),
  unique (negocio_id, numero),
  unique (negocio_id, huella)
);

create table if not exists public.verifactu_lineas (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references public.verifactu_facturas(id) on delete restrict,
  descripcion text not null,
  cantidad numeric(12, 3) not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  tipo_iva numeric(5, 2) not null check (tipo_iva >= 0 and tipo_iva <= 100),
  base numeric(12, 2) not null check (base >= 0),
  cuota_iva numeric(12, 2) not null check (cuota_iva >= 0),
  total numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists verifactu_facturas_negocio_fecha_idx
  on public.verifactu_facturas (negocio_id, fecha_emision desc);

create index if not exists verifactu_lineas_factura_idx
  on public.verifactu_lineas (factura_id);

alter table public.verifactu_facturas enable row level security;
alter table public.verifactu_lineas enable row level security;

-- The API uses the service role only after validating the user's bearer token
-- and ownership of the negocio. No client-side table access is granted here.
