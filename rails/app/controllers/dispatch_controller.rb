class DispatchController < ApplicationController
  skip_before_filter :verify_authenticity_token, :only => [:record]

  def learn
  end

  def teach
  end

  def record
    claim = JWT.decode(params[:token], ENV['JWT_HACKDUKE14'])
    
  end
end
