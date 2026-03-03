import { serial } from "drizzle-orm/mysql-core";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

// export const users = pgTable("users", {
//   id: uuid("id")
//     .defaultRandom()
//     .notNull()
//     .primaryKey(),

//   name: text("name").notNull(),

//   email: varchar("email", { length: 255 })
//     .notNull()
//     .unique(),

//   password: varchar("password", { length: 255 }).notNull(),

//   role: varchar("role", { length: 20 }).notNull(),

//   createdAt: timestamp("created_at", { withTimezone: true })
//     .defaultNow()
//     .notNull(),
// });


export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});