class DispatchController < ApplicationController
  def learn
  end

  def teach
  end

  def record
    claim = JWT.decode(params[:token], ENV['JWT_HACKDUKE14'])[0]
    tutoring_session = TutoringSession.from_claim(claim)
    tutoring_session.save!
    render nothing: true
  end

  def rate
    tutoring_session = TutoringSession.find(params[:id])
    if !params[:rating_for_student].nil? && tutoring_session.tutor == current_user
      tutoring_session.rating_for_student = params[:rating_for_student].to_i
    end
    if !params[:rating_for_tutor].nil? && tutoring_session.student == current_user
      tutoring_session.rating_for_tutor = params[:rating_for_tutor].to_i
    end
    tutoring_session.save!

    redirect_to(:back)
  end
end
