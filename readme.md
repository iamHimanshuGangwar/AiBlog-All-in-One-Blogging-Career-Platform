# AiBlog — All‑in‑One Blogging & Career Platform

AiBlog is a full-stack blogging and career platform that combines content creation, AI-powered features, and a job board with application tracking. It includes:

- A React + Vite frontend with Tailwind CSS
- A Node.js + Express backend with MongoDB (Mongoose)
- JWT-based authentication with OTP verification on registration
- Admin panel for posting jobs and managing applications
- User flows: view blogs, create posts, resume builder, AI image generator, search jobs and apply with resume upload

---


## Highlights

- Job board with resume upload (multipart/form-data) and application status tracking
- Resume Builder and Image Generator (AI features) behind authentication
- Admin-only routes for posting jobs and reviewing applications
- File uploads stored under `server/uploads/` (resumes, tts, etc.)
- Uses Axios with a centralized auth interceptor (AppContext)

---

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion
- Backend: Node.js, Express, Mongoose (MongoDB)
- Auth: JWT, OTP email verification
- File Uploads: Multer
- Utilities: nodemailer for OTP emails

---

## Screenshot
<img width="1710" height="1107" alt="Image" src="https://github.com/user-attachments/assets/22970b98-18e5-4a98-889a-172eee8977e0" />

---


## Repo Structure

- `client/` — React frontend
	- `src/` — React source files (components, pages, context)
	- `public/` — Static assets
- `server/` — Express backend
	- `controllers/` — Request handlers
	- `models/` — Mongoose schemas
	- `routes/` — Express routers
	- `middlewares/` — auth, multer, file upload handlers
	- `uploads/` — persisted uploaded files (resumes, tts)

---

## Getting Started (Local)

Prerequisites:

- Node.js 18+ and npm
- MongoDB instance (local or cloud)

1. Clone the repo

```bash
git clone <repo-url>
cd blogging
```

2. Install dependencies

```bash
npm --prefix server install
npm --prefix client install
```

3. Environment variables

Create a `.env` file in `server/` with the following variables (example):

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/your-db
JWT_SECRET=your_jwt_secret
MAIL_USER=your-email@example.com
MAIL_PASS=your-email-password-or-app-password
ADMIN_EMAIL=admingit@er.com
ADMIN_PASSWORD=admin1232
```

Notes:
- For Gmail, use an app password or OAuth2 credentials for `MAIL_PASS`.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` are used for the admin login route.

4. Start backend

npm start

5. Start frontend (in a separate terminal)

npm run dev

Open `http://localhost:5173` (or the port printed by Vite) to use the app.

---

## Important Pages & Routes

Frontend routes (examples):

- `/` — Home (blogs, features)
- `/jobs` — Job Portal (search, apply)
- `/resume-builder` — Resume Builder (auth required)
- `/image-generator` — Image Generator (auth required)
- `/admin` — Admin panel (admin only)

Key backend endpoints (JSON / multipart):

- `POST /api/auth/register` — register (sends OTP)
- `POST /api/auth/verify-otp` — verify OTP
- `POST /api/auth/login` — login (returns JWT token)

- `POST /api/job-listings/create` — create a job (admin)
- `GET /api/job-listings/all-jobs` — list jobs

- `POST /api/jobs/apply` — apply to job (protected, multipart/form-data: `resume` file)
- `GET /api/jobs/my-applications` — get user's applications (protected)
- `GET /api/jobs/all-applications` — admin: list all applications
- `PATCH /api/jobs/approve/:id` — admin approve application
- `PATCH /api/jobs/reject/:id` — admin reject application

Refer to `server/routes/` for full route mapping and middlewares.

---

## Admin Credentials (Dev)

- Email: `admingit@er.com`
- Password: `admin1232`

Use the admin login endpoint or the frontend admin login page to obtain a token for admin-only actions.

---

## Notes on File Uploads

- Resume uploads are validated for file type (`.pdf`, `.doc`, `.docx`) and size (default max 5MB) on the frontend and backend.
- Multer handles storage under `server/uploads/resumes` with unique filenames.
- The JobApplication model stores `resumePath` and `resumeFileName`.

---

## Development Tips

- Axios instance with auth interceptor is provided via `client/src/context/AppContext.jsx` — use `const { axios } = useAppContext()` so requests include the JWT automatically.
- If you change schemas, restart the backend to pick up changes.
- To test file uploads quickly, use `curl` with `-F` multipart form data and an `Authorization: Bearer <token>` header.

Example curl (submit application):

```bash
printf '%s' "Test resume" > /tmp/dummy_resume.pdf
curl -X POST http://localhost:4000/api/jobs/apply \
	-H "Authorization: Bearer <TOKEN>" \
	-F "jobId=<JOB_ID>" \
	-F "jobTitle=Title" \
	-F "jobCompany=Company" \
	-F "applicantName=Your Name" \
	-F "applicantEmail=you@example.com" \
	-F "coverLetter=Optional" \
	-F "resume=@/tmp/dummy_resume.pdf"
```

---

## Testing & QA

- Manual quick tests:
	- Register and verify OTP; login and confirm token present in browser storage.
	- Navigate to Jobs, click Apply, upload a resume — confirm success message and DB record.
	- As admin, create jobs via admin panel and review applications.

---

## Contributing

Contributions are welcome. For code changes:

1. Fork the repo
2. Create a feature branch
3. Run and test locally
4. Open a PR with description of the change

---

## License

This project does not include a license file. Add a LICENSE if you plan to open-source it.

---

If you want, I can also:

- Add an API reference markdown file listing all endpoints with request/response examples
- Add a quickstart script to install & run both client and server with one command
- Update README badges, screenshots, or a short demo GIF (you can provide assets)

Tell me which you'd like next.
