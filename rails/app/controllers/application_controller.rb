class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  def current_user
    return unless session[:user_id]
    @current_user ||= User.find(session[:user_id])
  end
  helper_method :current_user

  before_action :set_unrated_tutoring_sessions
  def set_unrated_tutoring_sessions
    return if !current_user
    @tutoring_sessions_without_rating_for_student = current_user.taught_sessions.where(:rating_for_student => nil)
    @tutoring_sessions_without_rating_for_tutor = current_user.learnt_sessions.where(:rating_for_tutor => nil)
  end

end
