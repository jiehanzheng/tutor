require 'test_helper'

class DispatchControllerTest < ActionController::TestCase
  test "should get learn" do
    get :learn
    assert_response :success
  end

  test "should get teach" do
    get :teach
    assert_response :success
  end

end
