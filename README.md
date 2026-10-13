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

Create a local `.env` file with the Vite Supabase URL and publishable key for client access. Server-side account creation also requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Keep the service role key server-only: never prefix it with `VITE_`, commit it, or expose it in browser code. Configure SMTP variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`) to enable welcome emails; email delivery is optional for account creation.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
