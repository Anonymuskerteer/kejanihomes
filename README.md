# Kejani Homes

<<<<<<< Updated upstream
Build a modern web application called **Kejani Homes**, a property discovery platform for Kenya that connects tenants with landlords and property agents.



## Branding



* Primary Colors:



  * Green: #317E3D

  * Yellow: #FEC111

  * White: #FFFFFF

* Modern, clean, trustworthy design.

* Mobile-first and fully responsive.

* Fast loading and optimized for low-bandwidth users.



---



# User Roles



1. Tenant

2. Landlord / Agent

3. Admin



---



# Authentication



* User registration

* User login

* Password reset

* Role selection during registration:



  * Tenant

  * Landlord / Agent



---



# Tenant Features



## Property Discovery



* Browse all available properties

* Search properties by location

* Search by property name

* Filter properties by:



  * County

  * Town

  * Estate

  * Rent price range

  * Number of bedrooms

  * Number of bathrooms

  * Property type



    * Bedsitter

    * Studio

    * Single Room

    * One Bedroom

    * Two Bedroom

    * Three Bedroom

    * Maisonette

    * Apartment

    * House

  * Furnished / Unfurnished



## Property Listing Page



Each property should display:



* Property title

* Property description

* Monthly rent

* Location

* Google Maps location

* Property images gallery

* Main cover image

* Amenities

* Date posted

* Number of views

* Number of saves

* Average rating

* Property availability status



## Map View



* Show property on map

* Show nearby landmarks

* Allow users to open directions



## Save Properties



* Save property

* Remove saved property

* View saved properties page



## Property Reviews



Users can rate properties based on:



* Overall rating

* Security

* Water availability

* Cleanliness

* Noise levels

* Internet availability

* Landlord responsiveness



Users can also leave written reviews.



## Contact Access



* Visitors can browse properties without logging in.

* Users must create an account and log in before viewing:



  * Landlord phone number

  * WhatsApp number

  * Email address



## Share Property



* Share via WhatsApp

* Copy property link



## Report Listing



Users can report:



* Scam listing

* Incorrect information

* Wrong location

* Duplicate property

* Inappropriate content



---



# Landlord / Agent Features



## Dashboard



Dashboard should display:



* Total listings

* Active listings

* Rented listings

* Total views

* Total saves

* Average property ratings



## Property Management



Create property listing with:



* Property title

* Property description

* Monthly rent

* Property type

* Bedrooms

* Bathrooms

* Amenities

* County

* Town

* Estate

* Exact map location

* Google Maps pin

* Contact phone number

* WhatsApp number

* Email



## Image Uploads



* Upload multiple property images

* Select cover image

* Reorder images

* Delete images



## Listing Controls



* Create listing

* Edit listing

* Delete listing

* Mark property as rented

* Mark property as available

* Hide listing



## Reviews



Landlords can:



* View ratings

* View reviews

* Respond to reviews



---



# Admin Features



## Dashboard Analytics



Display:



* Total users

* Total tenants

* Total landlords

* Total listings

* Active listings

* Rented listings

* New registrations

* Most viewed properties

* Most saved properties



## User Management



Admin can:



* View users

* Search users

* Suspend users

* Activate users

* Delete users



## Listing Management



Admin can:



* View all listings

* Approve listings before publication

* Reject listings

* Delete listings

* Hide listings



## Reports Management



Admin can:



* View reported properties

* View report reasons

* Resolve reports

* Remove fraudulent listings



---



# Trust & Safety Features



* Listing approval workflow

* User suspension system

* Fraud reporting system

* Verified Agent badge system

* Verified Landlord badge system



---



# Homepage



Include:



* Hero section

* Search bar

* Featured properties

* Recently added properties

* Popular locations

* How Kejani Homes works

* Testimonials

* Call to action



---



# Additional Features



## Favorites



Users can maintain a wishlist of properties.



## Recently Viewed



Users can revisit recently viewed properties.



## Notifications



Notify users when:



* Property is approved

* Listing is rejected

* Property receives a review



---



# Technical Requirements



* Modern dashboard UI

* R

esponsive design

* Clean card-based property layout

* Google Maps integration

* Authentication and role-based access

* Optimized image galleries

* Scalable database structure



Generate complete pages, navigation, dashboards, forms, database schema, and user flows for all features above.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kejanihomes.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/15ce9a27-1e71-48ed-a280-e83d73da1fbe).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
=======
Kejani Homes is a responsive rental-property discovery platform for Kenya. It connects tenants with landlords and agents through searchable property listings, direct messaging, saved homes, and property reviews.

## Features

### Public website

- Responsive landing page with property search, featured homes, and a getting-started overview.
- Browse approved rental listings without signing in.
- Search by property name or location; filter by county, property type, bedrooms, and rent range.
- Sort by newest, lowest or highest rent, and rating.
- Switch between a property grid and map view.
- View property photos, monthly rent, deposit, location, amenities, availability, and reviews.
- Open map directions, share listings, and report a listing.
- Contact details and messaging require an account.

### Accounts and authentication

- Register as a tenant or landlord/agent and sign in with email and password.
- Email confirmation with a six-digit code, code resend, and the option to correct an email address during activation.
- Password recovery by secure email link; the recovery email template also includes an OTP fallback.
- Set a new password after opening a valid recovery link.
- Role-specific getting-started walkthrough.
- Profile management, including account details and profile photo.

### Tenant experience

- Tenant dashboard with saved homes, reviews, and quick links.
- Save and unsave listings; review saved homes in the wishlist.
- Rate and review properties.
- Contact landlords and agents through protected contact details or in-app messaging.
- Continue conversations from the Messages page.

### Landlord and agent experience

- Dashboard with listing and engagement summaries.
- Create and edit property listings with descriptions, property type, monthly rent, deposit, bedrooms, amenities, location, and contact information.
- Upload and manage listing photos.
- Select a map location for a listing.
- Track listing status and manage availability from the dashboard.
- Review tenant feedback on property pages.

### Administration

- Platform analytics for users, listings, ratings, activity, and engagement.
- Search and filter user accounts; activate, deactivate, ban, reset, or delete accounts when elevated server credentials are configured.
- Review recent system and site-activity logs.
- User profile and role listings can use the signed-in admin's database permissions when the elevated server key is unavailable; account actions and ban management require that key.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/how-it-works` | Product overview |
| `/browse` | Search, filter, and map rental listings |
| `/property/$id` | Property details, map, reviews, contact, and reporting |
| `/auth` | Sign in and account creation |
| `/activate` | Handle account-confirmation links |
| `/getting-started` | Role-specific walkthrough |
| `/forgot-password` | Request a password-recovery email |
| `/reset-password` | Choose a new password from a recovery link |
| `/dashboard` | Tenant, landlord, or admin dashboard |
| `/list-property` | Create or edit a property listing |
| `/saved` and `/wishlist` | Saved listings |
| `/chat` | Tenant/landlord messages |
| `/profile` | Account profile |
| `/admin/analytics` | Admin analytics |
| `/admin/users` | Admin user management |
| `/admin/logs` | Admin activity and system logs |

## Technology

- React, TypeScript, Vite, and TanStack Start/Router.
- Supabase Auth, Postgres, Row Level Security, and Storage.
- React Query for server state.
- Leaflet maps.
- Tailwind CSS and shadcn-style UI components.

## Run locally

Requirements: Node.js and npm.

```powershell
npm install
>>>>>>> Stashed changes
npm run dev
```

The development server prints its local URL when it starts. To create a production build:

```powershell
npm run build
npm run preview
```

## Environment configuration

Use `.env.local` or your deployment platform's secret manager for local/server configuration. Never commit `.env` files or expose privileged keys through a `VITE_` variable. Set `APP_URL` and `VITE_APP_URL` to the canonical Vercel origin (for example, `https://your-project.vercel.app`) so authentication emails always redirect to the deployed app rather than whichever preview domain initiated signup.

Client configuration:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Server configuration:

```dotenv
APP_URL=https://your-project.vercel.app
VITE_APP_URL=https://your-project.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

`SUPABASE_SECRET_KEY` is also accepted in place of `SUPABASE_SERVICE_ROLE_KEY`. The service-role/secret key bypasses RLS and must only be used by trusted server code. Do not commit it or send it to the browser.

App SMTP variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`) enable optional welcome-email delivery. Authentication confirmation and recovery mail are sent by Supabase Auth and must be configured separately in the Supabase project.

## Supabase email setup

1. Configure a verified SMTP provider in **Supabase → Authentication → SMTP Settings**.
2. Set Supabase **Authentication → URL Configuration → Site URL** to the canonical Vercel origin.
3. Add the canonical Vercel origin and its `/activate` and `/reset-password` URLs to the Auth redirect allow list. Include Vercel preview origins only if those deployments should receive auth links.
4. Apply `supabase/templates/confirmation.html` to **Authentication → Email Templates → Confirm signup**.
5. Apply `supabase/templates/recovery.html` to **Authentication → Email Templates → Reset password**.
6. Keep `{{ .Token }}` in both templates to include the six-digit OTP. The recovery template also includes `{{ .ConfirmationURL }}` as a direct reset link.
7. `supabase/config.toml` configures the local Auth OTP length to six. Hosted projects must use matching settings and templates.

The recovery flow sends a link to `/reset-password`. Opening a valid Supabase recovery link establishes a recovery session; the user enters and confirms a new password there. The six-digit code in the same recovery email is available as a fallback on the forgot-password page.

## Database and storage

- SQL schema changes are kept under `supabase/migrations/`; apply the migrations to the target Supabase project.
- Supabase Storage is used for property and profile images, subject to the configured bucket policies.
- Row Level Security controls access to user data and actions. Admin server operations that bypass RLS require the server-only service/secret key.

## Project scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build with development mode |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
