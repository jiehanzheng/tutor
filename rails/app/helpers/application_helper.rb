module ApplicationHelper

  def user_identity_jwt
    return "null" if current_user.nil?
    current_user_claim = current_user.attributes
    current_user_claim['average_tutor_rating'] = current_user.average_tutor_rating
    ('"' + JWT.encode(current_user_claim, ENV['JWT_HACKDUKE14']) + '"').html_safe
  end

end
