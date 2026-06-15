-- 002_add_phone_verification.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT false;
--
You are being helpful.Thank you!
While the tickets are generated,
Users should be able to make actual payments via mobile money or via card.Is this currently possible?(Because the moment users tap mobile money there is no option to enter the mobile money number to be used for paying/or the card to be used
--