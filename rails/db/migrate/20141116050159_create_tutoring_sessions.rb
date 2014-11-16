class CreateTutoringSessions < ActiveRecord::Migration
  def change
    create_table :tutoring_sessions do |t|
      t.integer :tutor_id
      t.integer :student_id
      t.datetime :start_time
      t.datetime :end_time

      t.timestamps
    end
  end
end
