## To Do
* *- Share Vercel deployment link and GitHub repository in the GC* *
* *- Convert selected components into modal forms* *
* *(Transaction/Record Information Module)* *
~~(Request Tracking - Add Request)~~
~~(Supply Inventory - Add Product)~~
* *- Implement proper labels and naming conventions* *
* *(Task Management - Add Task)* *
* *- Organize Transactions and Inventory tables into tabs similar to Task Management* *
* *- Display the 5 most recent transactions on the Dashboard* *
* *- Integrate Supabase Database* *
* *- Apply the orange color scheme throughout the system* *
* *- Add filtering functionality* *
* *- Implement file locator based on document circulation/release location* *
* *- Remove pricing-related fields from Supply and Inventory* *
* *- Remove Task List module (not required)* *
* *- Configure Search Bar functionality* *


## Others

* *- Design and finalize the system logo* *
* *- Finalize database-related titles and field mappings* *
* *- Implement Notifications feature* *
* *- Add card-view layout for records/transactions* *
* *- Develop Supply and Inventory usage statistics* *
* *- Refine terminology to better align with the project scope* *
* *- Share demo version with Ma'am Aubrey* *

## Supabase setup

The Supabase client is available from `src/supabase/supabaseClient.js`:

```js
import { supabase } from "./supabase/supabaseClient";
```

Create a local `.env` file using `.env.example` and set
`REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`. Restart the
development server after changing environment variables. Only use the
Supabase project's public anon/publishable key in this browser app; never put
a service-role key in client-side code.

The client setup does not migrate or synchronize the app's local-storage data.
Connect individual features to Supabase after defining their database tables
and access policies.

## User accounts

The login screen supports Supabase email/password sign-in and account creation.
Sign-up collects a full name and one of the workspace roles, then returns to
sign-in. If email confirmation is enabled in Supabase Auth, users must confirm
their email before signing in.

The selected role is stored in Supabase Auth user metadata and controls which
screens the client displays. Client-side roles are not a security boundary:
before storing or exposing protected data in Supabase, enforce access with
database Row Level Security policies and trusted role assignment.
