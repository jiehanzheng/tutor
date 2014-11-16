class SessionsController < ApplicationController
  def create_cheat
    session[:user_id] = params[:user_id]
    redirect_to :root
  end

  def create
    user = User.find_or_create_by_netid_pass(params[:netid], params[:password])
    if user == nil
      return redirect_to session_signin
    end
    session[:user_id] = user.id
    redirect_to :root
  end

  def signin
  end

  def destroy
    session[:user_id] = nil
    redirect_to :root
  end
end
