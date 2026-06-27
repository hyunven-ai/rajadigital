-- Tambah kolom permissions ke tabel admins
-- permissions: array of permission keys yang diizinkan untuk admin ini
-- NULL = superadmin (semua akses) atau default OP/CS preset
-- Contoh nilai: ARRAY['transactions', 'bongkar_chip', 'transactions_history', 'bongkar_chip_history']

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT NULL;

COMMENT ON COLUMN admins.permissions IS 
  'Array permission keys. NULL = ikuti default role. 
   Superadmin selalu dapat semua akses.
   Keys: dashboard, transactions, transactions_history, bongkar_chip, bongkar_chip_history,
         products, banners, gallery, games, settings, admins';
