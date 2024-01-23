class NetworkController < ApplicationController

  before_action :network_params, :breadcrumbs

  private
  def breadcrumbs
    @breadcrumbs = [
      {name: 'Blockchains', url: locale_path_prefix},
      {name: @network[:name], url: "#{locale_path_prefix}#{@network[:network]}"},
      (params[:address] ? {name: "#{t("tabs.#{controller_name}.show.name")}: #{params[:address].truncate(15)}", url: "#{locale_path_prefix}#{@network[:network]}/address/#{params[:address]}"} : nil),
      (params[:token1] ? {name: "#{params[:token1].truncate(15)} - #{params[:token2].truncate(15)}", url: "#{locale_path_prefix}#{@network[:network]}/tokenpair/#{params[:token1]}/#{params[:token2]}"} : nil),
      (params[:block] ? {name: "#{t("tabs.#{controller_name}.show.name")}: #{params[:block].truncate(15)}", url: "#{locale_path_prefix}#{@network[:network]}/block/#{params[:block]}"} : nil),
      (params[:hash] ? {name: "#{t("tabs.#{controller_name}.show.name")}: #{params[:hash].truncate(15)}", url: "#{locale_path_prefix}#{@network[:network]}/tx/#{params[:hash]}"} : nil),
      ((params[:address] || params[:block] || params[:hash]) && action_name != 'show' ? {name: t("tabs.#{controller_name}.#{action_name}.name"), url: "#{locale_path_prefix}#{@network[:network]}/#{params[:hash]}"} : nil),
      (params[:symbol] ? {name: "#{t("tabs.#{controller_name}.show.name")}: #{params[:symbol].truncate(15)}", url: "#{locale_path_prefix}#{@network[:network]}/token/#{params[:symbol]}"} : nil),
    ].compact
  end


  def locale_path_prefix
    if params[:locale]
      "/#{params[:locale]}/"
    else
      '/'
    end
  end


  def network_params
    raise "Network not defined" unless params[:network]
    @network = params[:network].kind_of?(ActionController::Parameters) ?
                 params[:network].permit(:network, :tag, :name, :family, :currency, :icon, :streaming, :chainId, :platform, :innovation).to_h :
                 BLOCKCHAIN_BY_NAME[params[:network]]

    @id = params[:id]
    @streaming = @network[:streaming]

    if params[:address]
      @address = @query = params[:address]
    elsif params[:block] || params[:height]
      @height = params[:block] || params[:height]
    elsif params[:hash]
      @hash = @query = params[:hash]
    end
  end


end

