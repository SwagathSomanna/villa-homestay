#### TBD

- A script (utils/seed.js) run manually to populate the db with initial values. (admin can change the values later)

- basic modelling (pardon rdbms lingo, tables= collections)

  - one table which stores all the existing bookings.
  - one main table which stores the initial values.
  - remaining rooms can be inferred from the above two tables

- need to show how many rooms are remaining and current status. | fetch from db.
- dedicated admin panel where he can get an overview of the rooms boooked, change the prices, block any slots etc.
- payment gateway integration. (tbd after end to end payment logic, admin blocking and availability calculation works right.)
- remodelling of the frontend to fit these.

---

- 1 villa 4 rooms.
- add on activites only display, no payment.
- Ground floor: 9k
- top floor: 8k

---

**trackign the user**

- generate a random token at booking time
- store it in db
- send link with token in email

```
https://yourvilla.com/manage-booking?id=VILLA-9F3A21&token=abc123
```

when user opens, backend can be verified by

```
find booking where _id = id AND accessToken = token
```
