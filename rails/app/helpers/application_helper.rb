module ApplicationHelper

  def user_identity_jwt
    return "null" if current_user.nil?
    ('"' + JWT.encode(current_user, ENV['JWT_HACKDUKE14']) + '"').html_safe
  end

end
