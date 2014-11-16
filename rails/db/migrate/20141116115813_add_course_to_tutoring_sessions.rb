class AddCourseToTutoringSessions < ActiveRecord::Migration
  def change
    add_column :tutoring_sessions, :course, :string
  end
end
