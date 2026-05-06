-- Tambahkan kolom username ke tabel transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS username TEXT;

-- (Opsional) Update komentar kolom untuk dokumentasi
COMMENT ON COLUMN public.transactions.username IS 'Menyimpan nama pengguna atau nama dalam game untuk transaksi tersebut';
