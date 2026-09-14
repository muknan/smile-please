# Trusted intake and account ownership

Status: Accepted for implementation, September 2026.

Public forms must pass validation and abuse controls before a server-only client invokes transactional intake. Session-derived actor identity is trusted; form-provided identity never is. Existing account contact details cannot be replaced by a guest who knows an email address. Holds are capabilities and rescheduling updates one owned appointment atomically.

We retain the existing identity schema to avoid a broad migration of sensitive records. A future independent care-recipient model may simplify guest claiming, but it is not necessary to close these vulnerabilities. RLS and explicit RPC authorization remain mandatory.
