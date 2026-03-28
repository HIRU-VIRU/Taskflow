# Taskflow Testing Credentials

The database comes pre-seeded with 8 fully functional testing tenants and a global Platform Super Owner account. Use the credentials below to log in and test different roles and subscription plans.

## Platform Admin (Super Owner)
Use this account to view global metrics, manage tenants, and observe platform-wide revenue.
- **Login URL:** `http://localhost:5173/platform/login`
- **Email:** `admin@taskflow.platform`
- **Password:** `SuperOwner@123`

---

## Tenant Admins
Use these accounts to test the standard user portal, project management, and tenant-level billing/usage stats.

> **Login URL:** `http://localhost:5173/login`
> **Password for ALL accounts:** `Demo@1234`

| Tenant Name         | Login Email                      | Tenant Slug       | Plan       |
| ------------------- | -------------------------------- | ----------------- | ---------- |
| Acme Corporation    | `admin@acme-corp.com`        | `acme-corp`       | Enterprise |
| TechStart Inc       | `admin@techstart-inc.com`    | `techstart-inc`   | Pro        |
| DesignHub Studio    | `admin@designhub.com`        | `designhub`       | Pro        |
| ByteForge Labs      | `admin@byteforge-labs.com`   | `byteforge-labs`  | Free       |
| CloudNine Solutions | `admin@cloudnine.com`        | `cloudnine`       | Enterprise |
| Greenwave Tech      | `admin@greenwave-tech.com`   | `greenwave-tech`  | Pro        |
| MicroSystems Co     | `admin@microsystems-co.com`  | `microsystems-co` | Free       |
| NexGen AI           | `admin@nexgen-ai.com`        | `nexgen-ai`       | Enterprise |

*Note: For the standard `/login` route, you will need to input the exact **Tenant Slug** (the 3rd column above) alongside the email and password.*
