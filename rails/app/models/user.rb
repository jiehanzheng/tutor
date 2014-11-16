class User < ActiveRecord::Base
  serialize :courses

  has_many :taught_sessions, foreign_key: :tutor_id, class_name: :TutoringSession
  has_many :learnt_sessions, foreign_key: :student_id, class_name: :TutoringSession
  
  def self.find_or_create_by_netid_pass(netid, pass)
    if !auth_by_netid_pass(netid, pass)
      return nil
    end

    user = where(:netid => netid).first || create_by_netid(netid)
  end

  def self.create_by_netid(netid)
    create!(netid: netid)
  end

  def self.auth_by_netid_pass(netid, pass)
    logged_in = false
    begin
      Net::SSH.start('teer23.oit.duke.edu', netid, :password => pass, :auth_methods => ['password']) do |ssh|
        logged_in = true
      end
    rescue Net::SSH::AuthenticationFailed
    end

    return logged_in
  end

  def update_info_from_duke_api!

  end

end
