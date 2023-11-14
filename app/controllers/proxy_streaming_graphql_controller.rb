class ProxyStreamingGraphqlController < ApplicationController

	def index
	  api_key = ENV['EXPLORER_API_KEY']
  
	  BitqueryLogger.extra_context query: params[:query],
								   variables: params[:variables]
  
	  uri = URI(BITQUERY_STREAMING_GRAPHQL)
	  res = Net::HTTP.post(uri,
						   { query: params[:query], variables: params[:variables] }.to_json,
						   { 'Content-Type' => 'application/json',
							 'Accept' => 'application/json',
							 'X-API-KEY' => api_key })
  
	  respond_to do |format|
		format.json {
		  render json: res.body
		}
	  end
	end
  
  end
  