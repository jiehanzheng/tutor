class User < ActiveRecord::Base
  serialize :courses

  has_many :taught_sessions, foreign_key: :tutor_id, class_name: :TutoringSession
  has_many :learnt_sessions, foreign_key: :student_id, class_name: :TutoringSession
  
  def self.find_or_create_by_netid_pass(netid, pass)
    if !auth_by_netid_pass(netid, pass)
      return nil
    end

    user = where(:netid => netid).first || create_by_netid(netid)
    user.update_info_from_duke_api!

    user
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
    require 'open-uri'
    api_response = JSON.load(open('http://localhost:8080/duke_api/ldap/people/netid/' + netid))[0]
    puts api_response.inspect
    write_attribute(:display_name, api_response['display_name'])
    write_attribute(:phone, api_response['phones'][0])
    save!
  end

  def average_tutor_rating
    taught_sessions.all.average(:rating_for_tutor)
  end

  def average_student_rating
    learnt_sessions.all.average(:rating_for_student)
  end

end
