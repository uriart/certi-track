-- Certi-Track Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Tabla de partidas (partidas del presupuesto de obra)
CREATE TABLE IF NOT EXISTS partidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concepto TEXT NOT NULL,
  precio_total NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de certificaciones
CREATE TABLE IF NOT EXISTS certificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  observaciones TEXT,
  pdf_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla deitems de certificación (por cada partida en cada certificación)
CREATE TABLE IF NOT EXISTS certificacion_partidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificacion_id UUID NOT NULL REFERENCES certificaciones(id) ON DELETE CASCADE,
  partida_id UUID NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
  porcentaje NUMERIC(5, 2) NOT NULL,
  importe NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(certificacion_id, partida_id)
);

-- Tabla de extras (partidas adicionales fuera del presupuesto principal)
CREATE TABLE IF NOT EXISTS extras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concepto TEXT NOT NULL,
  precio_total NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de certificaciones de extras
CREATE TABLE IF NOT EXISTS certificaciones_extras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  observaciones TEXT,
  pdf_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de items de certificación de extras
CREATE TABLE IF NOT EXISTS certificacion_extras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificacion_extra_id UUID NOT NULL REFERENCES certificaciones_extras(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES extras(id) ON DELETE CASCADE,
  importe NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(certificacion_extra_id, extra_id)
);

-- Habilitar Row Level Security (RLS) - para este caso solo necesitamos que sea accesible sin auth
ALTER TABLE partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificacion_partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificaciones_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificacion_extras ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso público (sin auth)
CREATE POLICY "Allow public access" ON partidas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON certificaciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON certificacion_partidas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON extras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON certificaciones_extras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON certificacion_extras FOR ALL USING (true) WITH CHECK (true);

