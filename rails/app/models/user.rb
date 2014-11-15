class User < ActiveRecord::Base
  serialize :courses
  
end
