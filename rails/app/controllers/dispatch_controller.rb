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
end
