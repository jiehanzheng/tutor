class SessionsController < ApplicationController
  def create_cheat
    session[:user_id] = params[:user_id]
    redirect_to :root
  end

  def create

  end

  def signin
    
  end

  def destroy
    session[:user_id] = nil
  end
end
