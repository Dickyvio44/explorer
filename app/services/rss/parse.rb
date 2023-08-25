require 'feedjira'
require 'open-uri'
require 'uri'

module Rss
  class Parse < ApplicationService
    def initialize(url)
      @url = url
    end

    def call
      Rails.cache.fetch(url, expires_in: 8.hours) do
        http = URI.open(url, open_timeout: 3, read_timeout: 3)

        Feedjira.parse(http.read)
      end
    rescue
      nil
    end

    private

    attr_reader :url
  end
end
