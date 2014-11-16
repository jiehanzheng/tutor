class ChangeRatingTypeToFloatInTutoringSessions < ActiveRecord::Migration
  def change
    change_column :tutoring_sessions, :rating_for_student, :float
    change_column :tutoring_sessions, :rating_for_tutor, :float
  end
end
