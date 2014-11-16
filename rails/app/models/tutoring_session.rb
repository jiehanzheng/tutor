class TutoringSession < ActiveRecord::Base
  belongs_to :tutor, class_name: :User
  belongs_to :student, class_name: :User

  def self.from_claim(claim)
    tutoring_session = TutoringSession.new
    tutoring_session.tutor_id = claim['tutorId'].to_i
    tutoring_session.student_id = claim['studentId'].to_i
    tutoring_session.start_time = Time.at(claim['startTime'].to_i / 1000).utc.to_datetime
    tutoring_session.end_time = Time.at(claim['endTime'].to_i / 1000).utc.to_datetime
    tutoring_session.course = claim['course']
    tutoring_session.rating_for_student = nil
    tutoring_session.rating_for_tutor = nil
    tutoring_session
  end
end
