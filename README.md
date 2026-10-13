# Kejani Homes

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

Create a local `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for client access. Server-side admin pages and account-management actions also require `SUPABASE_URL` and a server-only `SUPABASE_SERVICE_ROLE_KEY` (or Supabase `SUPABASE_SECRET_KEY`). Keep these elevated keys server-only: never prefix them with `VITE_`, commit them, or expose them in browser code.

Configure the Supabase project's **Authentication → SMTP settings** with a verified mail provider to deliver signup confirmation, activation, and password recovery emails. Add `${APP_ORIGIN}/activate` and `${APP_ORIGIN}/forgot-password` to the Supabase Auth redirect URL allow list. The app's own SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`) are separately used for welcome emails; set these in the server environment to enable those messages. Use port `587` for STARTTLS or `465` for implicit TLS. Without a configured provider, Supabase Auth cannot deliver confirmation or recovery email.

The signup activation and password recovery emails must include the Supabase `{{ .Token }}` template variable because the app accepts six-digit codes. The templates are in `supabase/templates/confirmation.html` and `supabase/templates/recovery.html`; local Supabase configuration sets the OTP length to six in `supabase/config.toml`. Apply their subjects and HTML under **Authentication → Email Templates → Confirm signup** and **Reset password** in the hosted Supabase project (or deploy the Supabase Auth configuration using your normal Supabase CLI workflow). Check both templates after deployment: each email body must visibly contain the rendered six-digit `{{ .Token }}`. A template that only renders `{{ .ConfirmationURL }}` sends a link but no code. Activation resend uses the same signup confirmation template, and password-reset resend uses the same recovery template.

The admin users page can display profiles and roles through the authenticated admin's database permissions without an elevated key. It is read-only without `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`; account-management actions and ban records require that server-only key.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
