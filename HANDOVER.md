# Smile Please — a short guide for the person running it

Written for someone who didn't build the site. No jargon. You run the daily work:
reading messages, matching patients with dentists, and approving new volunteer dentists.

> _Screenshot placeholders._ Most steps below have a `[screenshot]` mark. Replace them
> with real screenshots from the live site before you hand this to anyone else, or show
> them the steps live once.

---

## 1. Signing in (there is no password)

You don't pick a password. You get a **link by email** each time.

1. Go to your site and open the **Admin** area.
2. Enter your email address.
3. Check your inbox — you'll get an email from Smile Please with a **Sign in** button
   (check the spam folder the first time). Click it.
4. You're in. This link works for a while, then you ask for a new one the same way.

_[screenshot] the sign-in screen and the email._

---

## 2. The daily view

When you sign in you land on **Overview**. It shows what needs your attention, oldest
first — a red dot means "something is waiting":

- **Care requests unassigned** — someone asked for a dentist; no dentist has been
  matched yet.
- **Dentist enquiries unanswered** — a dentist wants to volunteer; this is the most
  important queue because the clinic can't run without volunteer dentists.
- **Bookings tomorrow, unconfirmed** — a time is set but the dentist hasn't said yes yet.

If nothing is waiting, it says **"Nothing waiting."** — that's a good sign.

_[screenshot] the Overview page._

### What the coloured dots mean

- **Orange / amber** — needs your attention soon.
- **Green** — confirmed / active / done.
- **Grey** — neutral, nothing wrong.
- **Red** — cancelled or a no-show record.

---

## 3. Matching a patient with a dentist

1. From **Overview**, click the "care requests unassigned" line.
2. You see the list of requests. Click one.
3. **Assign a dentist** — pick a dentist from the list (they're shown near your area
   first, with how many free slots they have).
4. Write a **one-line reason** (e.g. "Matched with Dr Khan near Seelampur"). This is
   required and it's your audit trail — years later you'll know why you chose them.
5. Save. The patient and the dentist both get an email.

_[screenshot] the assign screen._

---

## 4. Answering a message in the inbox

1. Open **Inbox**. **Dentists** is shown first because it's the most urgent — answer these
   quickly.
2. Click a message to read it in full.
3. You can:
   - **Change its status** (New → In review → Contacted → Resolved, or mark Spam).
   - **Convert to dentist profile** (on a dentist enquiry) — this creates a login for
     them so they can fill in their details and add their own times.
   - **Reply by email** — a ready-made email link with the reference code opens.
4. Patients and organisations are in the other tabs.

_[screenshot] the inbox and a message opened._

---

## 5. Adding a new dentist

Two ways:

- If a dentist contacted you through the site, open their message and press
  **Convert to dentist profile** (§4). Then in **Dentists**, **Approve** them.
- **Dentists → Add** — if you've met a dentist another way (the client's father may get
  people this way). Enter their name, phone, email and DCI number, then Approve.

Before approving, tick **"I've checked the DCI register"** — this records, and keeps a
date on, that you checked the registration is real. This is manual on purpose (there's
no free automatic check).

You can also add **slot times** on a dentist's behalf, because many volunteers will
never log in themselves.

_[screenshot] the dentists list and the approve screen._

---

## 6. Writing an awareness article

1. Open **Articles**.
2. **New article**. You write on the left, and the right side previews **exactly** what
   readers see — keep writing until the preview looks right.
3. Fields: **Title**, a short **excerpt** (one line shown on the Learn page), a
   **category** (Prevention, Children, Gum health, Camps), and the body.
4. The body is **Markdown** — don't worry about the word. The buttons above it (bold,
   heading, list, link) do the work for you. If something gets messed up, the preview
   shows it immediately.
5. **Save draft** as you go, and **Publish** when ready. Published articles appear on
   the Learn page straight away.
6. **Unpublish** takes one off the site.

_[screenshot] the article editor with preview._

---

## 7. Downloading a copy of the records

**Exports** lets you download CSVs (spreadsheets) of bookings, contact messages,
consent records, or the audit log. It's useful for records and reporting.

> **Important:** exported files contain people's personal details. Keep them somewhere
> safe, and **delete them when you're done**. Every export is logged, so we know who
> downloaded what and when.

_[screenshot] the exports page._

---

## 8. If something looks wrong

1. Try signing out and back in (top-right corner) — this fixes most confusion.
2. Write down what you saw and when.
3. Contact your developer with: the date, what you were doing, and the exact message on
   screen. A screenshot helps. Your developer is: **_[developer name and email]_**

Do **not** share the patient's phone number or medical notes outside the team, and
don't paste them into emails that go to people who don't work with you.

---

## A few things that are not you

- **Passwords** — nobody has one, including you. It's emails only.
- **Payments** — this site never asks patients for money, and there is no "Donate"
  button. If you add a Donate button later, tell your developer first (free hosting
  isn't allowed to take donations and you'd need to move or upgrade — see the README).
- **SMS texts** — not in this version. Everything is email and phone calls.
