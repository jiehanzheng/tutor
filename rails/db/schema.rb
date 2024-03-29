# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20141116115813) do

  create_table "tutoring_sessions", force: true do |t|
    t.integer  "tutor_id"
    t.integer  "student_id"
    t.datetime "start_time"
    t.datetime "end_time"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.float    "rating_for_student"
    t.float    "rating_for_tutor"
    t.string   "course"
  end

  create_table "users", force: true do |t|
    t.string   "netid"
    t.text     "courses"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "display_name"
    t.string   "phone"
  end

end
