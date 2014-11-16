class AddDisplayNameAndPhoneToUsers < ActiveRecord::Migration
  def change
    add_column :users, :display_name, :string
    add_column :users, :phone, :string
  end
end
