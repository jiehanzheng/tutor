class AddRatingForStudentAndRatingForTutorToTutoringSessions < ActiveRecord::Migration
  def change
    add_column :tutoring_sessions, :rating_for_student, :integer
    add_column :tutoring_sessions, :rating_for_tutor, :integer
  end
end
