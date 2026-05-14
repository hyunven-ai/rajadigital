-- Menambahkan kolom log history untuk tabel transactions
ALTER TABLE public.transactions
ADD COLUMN processed_by VARCHAR(255),
ADD COLUMN processed_at TIMESTAMPTZ;

-- Menambahkan kolom log history untuk tabel bongkar_chip_requests
ALTER TABLE public.bongkar_chip_requests
ADD COLUMN processed_by VARCHAR(255),
ADD COLUMN processed_at TIMESTAMPTZ;
