class Cosmos::SitemapController < NetworkController

  QUERY = Graphql::V1::Client.parse <<-'GRAPHQL'
           query ($network: CosmosNetwork! $from: ISO8601DateTime){


                    proposers: cosmos(network: $network){
                      blocks(options:{desc: "count", limit: 50},
                        date: {since: $from }
                        ) {

                          address: proposer {
                            address
                          }

                          count

                      }
                    }

                   senders: cosmos(network: $network){
                        transfers(
                          sender: {not: ""},
                          options:{
                          desc: "count", 
                          limit: 100},
                          date: {since: $from }
                          ) {
                  
                            sender {
                              address
                            }
                  
                            count
                  
                        }
                     
                   }

                  receivers: cosmos(network: $network){
                        transfers(
                          receiver: {not: ""},
                          options:{
                          desc: "count", 
                          limit: 100},
                          date: {since: $from }
                          ) {

                            receiver {
                              address
                            }

                            count

                        }

                  }


           }
  GRAPHQL

  def index
    @response = Graphql::V1.instance.query_with_retry(QUERY, variables: { from: Date.today - 10,
                                                                              network: @network[:network]  }, context: {'Authorization': @streaming_access_token}).data
  end

end
