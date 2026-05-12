import { PrismaClient } from '@prisma/client';

// SSL is handled entirely via the DATABASE_URL env var:
//   sslmode=require           → enforce encrypted connection
//   sslaccept=accept_invalid_certs → skip CA chain validation
//                                    (works on Windows Schannel + Linux OpenSSL)
export const prisma = new PrismaClient();
