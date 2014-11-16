class User < ActiveRecord::Base
  serialize :courses

  has_many :taught_sessions, foreign_key: :tutor_id, class_name: :TutoringSession
  has_many :learnt_sessions, foreign_key: :student_id, class_name: :TutoringSession
  
end
