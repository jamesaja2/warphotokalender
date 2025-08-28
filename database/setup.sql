-- Sistem Rebutan Spot Foto Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable Row Level Security (RLS) for all tables
-- But for simplicity, we'll disable it for this demo

-- Create spots table
CREATE TABLE IF NOT EXISTS public.spots (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1,
    chosen_by TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kelas table
CREATE TABLE IF NOT EXISTS public.kelas (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    spot_id INTEGER REFERENCES public.spots(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create queue table (for future use)
CREATE TABLE IF NOT EXISTS public.queue (
    id SERIAL PRIMARY KEY,
    user_identifier TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data

-- Sample spots
INSERT INTO public.spots (name, capacity, chosen_by) VALUES
    ('Pocin', 3, '{}'),
    ('Panggung Pocin', 3, '{}'),
    ('Depan Pos Satpam arah gedung A', 3, '{}'),
    ('Perpustakaan', 3, '{}'),
    ('Lapangan Dekat Dapur Guru', 3, '{}'),
    ('Pohon samping Greenhouse', 3, '{}'),
    ('Visi Misi', 3, '{}'),
    ('Gazebo Rooftop Gedung D', 3, '{}'),
    ('Pintu Gedung A', 3, '{}'),
    ('Tangga gedung A', 3, '{}'),
    ('Bawah Jembatan Ros', 3, '{}'),
    ('Kursi Benedict room', 3, '{}'),
    ('Panggung Benedict room', 3, '{}')
ON CONFLICT DO NOTHING;

-- Sample kelas
INSERT INTO public.kelas (name, spot_id) VALUES
    ('X-A', NULL),
    ('X-B', NULL),
    ('X-C', NULL),
    ('X-D', NULL),
    ('X-E', NULL),
    ('X-F', NULL),
    ('X-G', NULL),
    ('X-H', NULL),
    ('X-I', NULL),
    ('X-J', NULL),
    ('X-K', NULL),
    ('X-L', NULL),
    ('X-M', NULL),
    ('XI-A1', NULL),
    ('XI-A2', NULL),
    ('XI-A3', NULL),
    ('XI-B1', NULL),
    ('XI-B2', NULL),
    ('XI-C1', NULL),
    ('XI-C2', NULL),
    ('XI-C3', NULL),
    ('XI-D1', NULL),
    ('XI-E1', NULL),
    ('XI-E2', NULL),
    ('XI-F1', NULL),
    ('XII-A1', NULL),
    ('XII-A2', NULL),
    ('XII-A3', NULL),
    ('XII-A4', NULL),
    ('XII-A5', NULL),
    ('XII-B1', NULL),
    ('XII-B2', NULL),
    ('XII-C1', NULL),
    ('XII-C2', NULL),
    ('XII-D1', NULL),
    ('XII-D2', NULL),
    ('XII-E1', NULL),
    ('XII-F1', NULL);
ON CONFLICT (name) DO NOTHING;

-- Default settings
INSERT INTO public.settings (key, value) VALUES
    ('booking_start_time', '2025-08-27T07:00:00+07:00'),
    ('max_concurrent_users', '100'),
    ('queue_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Create function for atomic booking
CREATE OR REPLACE FUNCTION public.book_spot(
    p_spot_id INTEGER,
    p_kelas_id INTEGER,
    p_kelas_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_spot_capacity INTEGER;
    v_current_chosen INTEGER;
    v_kelas_current_spot INTEGER;
BEGIN
    -- Check if kelas already has a spot
    SELECT spot_id INTO v_kelas_current_spot
    FROM public.kelas
    WHERE id = p_kelas_id;
    
    IF v_kelas_current_spot IS NOT NULL THEN
        RAISE EXCEPTION 'Kelas sudah memilih spot';
    END IF;
    
    -- Get spot capacity and current bookings
    SELECT capacity, array_length(chosen_by, 1) INTO v_spot_capacity, v_current_chosen
    FROM public.spots
    WHERE id = p_spot_id;
    
    -- Handle null array length
    IF v_current_chosen IS NULL THEN
        v_current_chosen := 0;
    END IF;
    
    -- Check if spot is full
    IF v_current_chosen >= v_spot_capacity THEN
        RAISE EXCEPTION 'Spot sudah penuh';
    END IF;
    
    -- Update both tables atomically
    UPDATE public.spots
    SET chosen_by = array_append(chosen_by, p_kelas_name),
        updated_at = NOW()
    WHERE id = p_spot_id;
    
    UPDATE public.kelas
    SET spot_id = p_spot_id,
        updated_at = NOW()
    WHERE id = p_kelas_id;
    
    RETURN TRUE;
END;
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER spots_updated_at
    BEFORE UPDATE ON public.spots
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER kelas_updated_at
    BEFORE UPDATE ON public.kelas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for all tables
ALTER TABLE public.spots REPLICA IDENTITY FULL;
ALTER TABLE public.kelas REPLICA IDENTITY FULL;
ALTER TABLE public.settings REPLICA IDENTITY FULL;

-- Enable RLS but allow all operations for simplicity
-- In production, you should implement proper RLS policies
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (for demo purposes)
-- In production, implement proper authentication and authorization
CREATE POLICY "Allow all on spots" ON public.spots FOR ALL USING (true);
CREATE POLICY "Allow all on kelas" ON public.kelas FOR ALL USING (true);
CREATE POLICY "Allow all on settings" ON public.settings FOR ALL USING (true);
CREATE POLICY "Allow all on queue" ON public.queue FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON public.spots TO anon, authenticated;
GRANT ALL ON public.kelas TO anon, authenticated;
GRANT ALL ON public.settings TO anon, authenticated;
GRANT ALL ON public.queue TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
